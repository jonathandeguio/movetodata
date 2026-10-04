package io.movetodata.ai.library.services;

import io.movetodata.ai.library.dto.UploadedFileDto;
import io.movetodata.ai.library.models.UploadedFile;
import io.movetodata.ai.library.repository.UploadedFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final long MAX_SIZE_DEFAULT = 200L * 1024 * 1024; // 200 MB

    @Value("${MOVETODATA_MOUNT_PATH:/opt/movetodata/data}")
    private String mountPath;

    private final UploadedFileRepository uploadedFileRepository;

    /**
     * Stores the uploaded file on disk and persists metadata to the database.
     * Storage path pattern: {mountPath}/file/{userId}/{uuid}/{filename}
     */
    public UploadedFileDto store(MultipartFile file, UUID userId) throws IOException {
        if (file.getSize() > MAX_SIZE_DEFAULT) {
            throw new IllegalArgumentException(
                    "File exceeds the maximum allowed size of " + (MAX_SIZE_DEFAULT / 1024 / 1024) + " MB");
        }

        String fileUuid = UUID.randomUUID().toString();
        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        String storedFilename = originalFilename != null ? originalFilename : fileUuid;

        Path targetDir = Paths.get(mountPath, "file", userId.toString(), fileUuid);
        Files.createDirectories(targetDir);

        Path targetPath = targetDir.resolve(storedFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        UploadedFile entity = UploadedFile.builder()
                .uuid(fileUuid)
                .filename(storedFilename)
                .originalFilename(originalFilename != null ? originalFilename : "unknown")
                .contentType(file.getContentType())
                .sizeBytes(file.getSize())
                .storagePath(targetPath.toAbsolutePath().toString())
                .userId(userId)
                .build();

        UploadedFile saved = uploadedFileRepository.save(entity);
        log.info("Stored file {} for user {} at {}", fileUuid, userId, targetPath);
        return UploadedFileDto.from(saved);
    }

    /**
     * Returns metadata for a single file, verifying user ownership.
     */
    public UploadedFileDto getMetadata(String fileUuid, UUID userId) {
        UploadedFile entity = uploadedFileRepository.findByUuidAndDeletedAtIsNull(fileUuid)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileUuid));
        if (!entity.getUserId().equals(userId)) {
            throw new SecurityException("Access denied to file: " + fileUuid);
        }
        return UploadedFileDto.from(entity);
    }

    /**
     * Returns all non-deleted files for the given user.
     */
    public List<UploadedFileDto> listForUser(UUID userId) {
        return uploadedFileRepository.findAllByUserIdAndDeletedAtIsNull(userId)
                .stream()
                .map(UploadedFileDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Returns the list of sheet names for an Excel file by delegating to the
     * Apache POI library. Returns an empty list for non-Excel files.
     */
    public List<String> getSheetNames(String fileUuid, UUID userId) throws IOException {
        UploadedFile entity = uploadedFileRepository.findByUuidAndDeletedAtIsNull(fileUuid)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileUuid));
        if (!entity.getUserId().equals(userId)) {
            throw new SecurityException("Access denied to file: " + fileUuid);
        }

        String path = entity.getStoragePath();
        if (!path.endsWith(".xlsx") && !path.endsWith(".xls")) {
            return List.of();
        }

        try (org.apache.poi.ss.usermodel.Workbook workbook =
                     org.apache.poi.ss.usermodel.WorkbookFactory.create(
                             new java.io.File(path))) {
            List<String> sheets = new java.util.ArrayList<>();
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                sheets.add(workbook.getSheetName(i));
            }
            return sheets;
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String sanitizeFilename(String rawName) {
        if (rawName == null) return null;
        // Strip directory traversal sequences and keep only safe characters
        return Paths.get(rawName).getFileName().toString()
                .replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
