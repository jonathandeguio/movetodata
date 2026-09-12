 package io.movetodata.passport.controllers;


import io.movetodata.passport.enums.AuthProvider;
import io.movetodata.passport.library.models.LoginHistory;
import io.movetodata.passport.library.models.User;
import io.movetodata.passport.library.models.UserPreferences;
import io.movetodata.passport.library.repository.LoginHistoryRepository;
import io.movetodata.passport.library.repository.UserRepository;
import io.movetodata.passport.security.TokenProvider;
import io.movetodata.passport.util.SSOUtils;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

 import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static io.movetodata.passport.security.SamlMetaDataParser.parseSAMLResponse;

@CrossOrigin
@RestController
@RequestMapping("/api/sso")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Passport", description = "Authentication service endpoints")
@ConfigurationProperties(prefix = "spring.security.saml2.relyingparty")
public class SingleSignOnController {
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final LoginHistoryRepository loginHistoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private Map<String, Object> registration;


    @Value("${platform-default-login:password}")
    String platformDefaultLogin;

    public void setRegistration(Map<String, Object> registration) {
        this.registration = registration;
    }

    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> ssoList(@AuthenticationPrincipal Object obj, HttpServletRequest request) {
        Set<String> keys = registration.keySet();

        Map<String, Object> response = new HashMap<>();
        response.put("samlList", keys.toArray(new String[0]));
        response.put("default", platformDefaultLogin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/callback")
    public ResponseEntity<Void> callbackSSO(@AuthenticationPrincipal Object obj, HttpServletRequest request) throws Exception {
        // Extract SAML response from the request
        String samlResponse = request.getParameter("SAMLResponse");

        // Parse the SAML response (this function should parse the XML, extract the necessary fields, etc.)
        Map<String, Object> parsedSAML = parseSAMLResponse(samlResponse);

        String frontendUrl = System.getenv("FRONTEND_URL") +  "/auth/login"; // Replace with your frontend URL

        HttpHeaders headers = new HttpHeaders();

        if(parsedSAML.get("certificate").equals(SSOUtils.getCertificateString())) {
            long tenYearsInSeconds = 2L * 365 * 24 * 60 * 60;  // 10 years in seconds
            if(userRepository.findByUsername((String) parsedSAML.get("nameId")).isEmpty()) {
                registerNewUser( (String) parsedSAML.get("nameId"),
                        ((Map<String, String>) parsedSAML.get("attributes")).get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"),
                        ((Map<String, String>) parsedSAML.get("attributes")).get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"));
            }
            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(parsedSAML.get("nameId"),"default"));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String accessToken = tokenProvider.createAccessToken(authentication);
            String refreshToken = tokenProvider.createRefreshToken(authentication);

            headers = AuthController.getAuthHeaders(accessToken, refreshToken, request.getScheme());

            frontendUrl = System.getenv("FRONTEND_URL") + "/sso/callback";
        }

        headers.set("Location", frontendUrl);
        return new ResponseEntity<>(headers, HttpStatus.FOUND); // HTTP 302 Found (redirect)
    }


    private User registerNewUser(String userName, String givenName, String familyName) {
        User user = new User();

        user.setProvider(AuthProvider.saml);
        user.setUsername(userName);

        user.setName(userName);
        user.setGivenName(givenName);
        user.setFamilyName(familyName);
        user.setEmail(userName);
        user.setPassword(passwordEncoder.encode("default"));
        user.setCreatedAt(new Date());
        user.setLastLoginAt(new Date());
        user.setPreferences(new UserPreferences());

        User savedUser = userRepository.save(user);

        // Login history
        LoginHistory loginHistory = new LoginHistory();


        loginHistory.setUserId(savedUser.getId());
        loginHistory.setLastLoginAt(new Date());
        loginHistory.setLastLoginAt(new Date());

        loginHistoryRepository.save(loginHistory);

        // Login history

        return savedUser;
    }
}
