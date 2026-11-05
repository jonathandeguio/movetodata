package io.movetodata.catalog.security;

import io.movetodata.catalog.library.models.CatalogRestrictedAccessLog;
import io.movetodata.catalog.library.repository.CatalogRestrictedAccessLogRepository;
import io.movetodata.catalog.library.repository.DataProductRepository;
import io.movetodata.passport.library.models.Groups;
import io.movetodata.passport.library.models.User;
import io.movetodata.passport.library.repository.GroupsRepository;
import io.movetodata.passport.library.repository.UserRepository;
import io.movetodata.passport.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Central access-control service for the Data Catalog.
 * <p>
 * Policy levels:
 * <ul>
 *   <li><b>PUBLIC</b> — any authenticated user may read.</li>
 *   <li><b>INTERNAL</b> — user must be a member of one of the catalog groups
 *       (CATALOG_READER, CATALOG_STEWARD, CATALOG_OWNER, CATALOG_DPO, CATALOG_DATAOPS).</li>
 *   <li><b>RESTRICTED</b> — only CATALOG_STEWARD, CATALOG_DPO, CATALOG_DATAOPS, or
 *       the designated CATALOG_OWNER of the data product. Access is always journalised.</li>
 * </ul>
 * PII columns are masked for users who are not CATALOG_DPO or CATALOG_STEWARD.
 */
@Service
@RequiredArgsConstructor
public class CatalogAccessService {

    // --- Catalog group name constants ---
    public static final String GROUP_READER   = "CATALOG_READER";
    public static final String GROUP_STEWARD  = "CATALOG_STEWARD";
    public static final String GROUP_OWNER    = "CATALOG_OWNER";
    public static final String GROUP_DPO      = "CATALOG_DPO";
    public static final String GROUP_DATAOPS  = "CATALOG_DATAOPS";

    private static final List<String> ALL_CATALOG_GROUPS =
            List.of(GROUP_READER, GROUP_STEWARD, GROUP_OWNER, GROUP_DPO, GROUP_DATAOPS);

    private static final List<String> RESTRICTED_GROUPS =
            List.of(GROUP_STEWARD, GROUP_DPO, GROUP_DATAOPS, GROUP_OWNER);

    private final GroupsRepository groupsRepository;
    private final UserRepository userRepository;
    private final DataProductRepository dataProductRepository;
    private final CatalogRestrictedAccessLogRepository accessLogRepository;

    /**
     * Returns the access decision for the current authenticated user on the given asset.
     *
     * @param assetId       FQN or UUID string of the data product
     * @param accessPolicy  PUBLIC | INTERNAL | RESTRICTED (from {@link io.movetodata.catalog.library.models.DataProduct#getAccessPolicy()})
     * @param request       HTTP request (used to capture IP address for audit)
     * @return {@link AccessDecision} — ALLOWED, DENIED, or ALLOWED_PII_MASKED
     */
    public AccessDecision canRead(String assetId, String accessPolicy, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return AccessDecision.DENIED;
        }

        AuthUser authUser = (AuthUser) auth.getPrincipal();
        UUID userId = authUser.getId();
        User user = userRepository.getReferenceById(userId);

        AccessDecision decision;

        switch (accessPolicy == null ? "INTERNAL" : accessPolicy.toUpperCase()) {
            case "PUBLIC":
                decision = shouldMaskPii(user) ? AccessDecision.ALLOWED_PII_MASKED : AccessDecision.ALLOWED;
                break;

            case "RESTRICTED":
                boolean isPrivileged = isInAnyGroup(user, RESTRICTED_GROUPS);
                if (!isPrivileged) {
                    decision = AccessDecision.DENIED;
                } else {
                    decision = shouldMaskPii(user) ? AccessDecision.ALLOWED_PII_MASKED : AccessDecision.ALLOWED;
                }
                writeRestrictedLog(assetId, userId, user.getEmail(), resolveHighestRole(user), extractIp(request), decision);
                break;

            case "INTERNAL":
            default:
                boolean isCatalogMember = isInAnyGroup(user, ALL_CATALOG_GROUPS);
                if (!isCatalogMember) {
                    decision = AccessDecision.DENIED;
                } else {
                    decision = shouldMaskPii(user) ? AccessDecision.ALLOWED_PII_MASKED : AccessDecision.ALLOWED;
                }
                break;
        }

        return decision;
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    /** Returns true if the user is a member of at least one of the given catalog groups. */
    public boolean isInAnyGroup(User user, List<String> groupNames) {
        for (String groupName : groupNames) {
            Groups group = groupsRepository.findByName(groupName);
            if (group != null && group.getMembers() != null && group.getMembers().contains(user)) {
                return true;
            }
        }
        return false;
    }

    /**
     * PII is masked when the user is not DPO or STEWARD.
     * The mask flag is surfaced to callers so they can omit PII column values in the response.
     */
    public boolean shouldMaskPii(User user) {
        List<String> privilegedForPii = List.of(GROUP_DPO, GROUP_STEWARD);
        return !isInAnyGroup(user, privilegedForPii);
    }

    /** Returns the highest catalog role name found for the user, or null. */
    public String resolveHighestRole(User user) {
        // Priority: DPO > STEWARD > OWNER > DATAOPS > READER
        List<String> priority = List.of(GROUP_DPO, GROUP_STEWARD, GROUP_OWNER, GROUP_DATAOPS, GROUP_READER);
        for (String groupName : priority) {
            Groups group = groupsRepository.findByName(groupName);
            if (group != null && group.getMembers() != null && group.getMembers().contains(user)) {
                return groupName;
            }
        }
        return null;
    }

    private void writeRestrictedLog(String assetId, UUID userId, String email,
                                     String role, String ip, AccessDecision decision) {
        CatalogRestrictedAccessLog log = CatalogRestrictedAccessLog.builder()
                .id(UUID.randomUUID())
                .assetId(assetId)
                .userId(userId)
                .userEmail(email)
                .userRole(role)
                .ipAddress(ip)
                .result(decision.name())
                .build();
        accessLogRepository.save(log);
    }

    private static String extractIp(HttpServletRequest request) {
        if (request == null) return null;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // -------------------------------------------------------------------------
    // Result type
    // -------------------------------------------------------------------------

    public enum AccessDecision {
        ALLOWED,
        DENIED,
        ALLOWED_PII_MASKED
    }
}
