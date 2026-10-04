package io.movetodata.ai.controllers;

import io.movetodata.ai.library.dto.UploadedFileDto;
import io.movetodata.ai.library.services.FileStorageService;
import io.movetodata.passport.library.Auth;
import io.movetodata.passport.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@CrossOrigin
@EnableWebMvc
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI File Import", description = "F5 — File upload and AI analysis endpoints")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    /**
     * POST /api/files/upload
     * Accepts a multipart file, stores it on disk and returns its metadata.
     */
    @Operation(summary = "Upload a file for AI analysis (xlsx, csv, json, parquet, pdf).")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<UploadedFileDto> upload(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam("file") MultipartFile file) throws IOException {

        UUID userId = authUser.getId();
        UploadedFileDto dto = fileStorageService.store(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * GET /api/files/{fileId}
     * Returns metadata for a previously uploaded file.
     */
    @Operation(summary = "Get metadata for an uploaded file.")
    @GetMapping("/{fileId}")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<UploadedFileDto> getMetadata(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("fileId") String fileId) {

        UUID userId = authUser.getId();
        UploadedFileDto dto = fileStorageService.getMetadata(fileId, userId);
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/files/{fileId}/sheets
     * Returns the list of sheet names for Excel files (.xlsx / .xls).
     * Returns an empty array for other formats.
     */
    @Operation(summary = "List Excel sheet names for an uploaded file.")
    @GetMapping("/{fileId}/sheets")
    @PreAuthorize(Auth.CONNECT_ADMIN)
    public ResponseEntity<List<String>> getSheets(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("fileId") String fileId) throws IOException {

        UUID userId = authUser.getId();
        List<String> sheets = fileStorageService.getSheetNames(fileId, userId);
        return ResponseEntity.ok(sheets);
    }
}
