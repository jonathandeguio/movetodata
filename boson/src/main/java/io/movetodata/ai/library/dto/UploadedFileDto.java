package io.movetodata.ai.library.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.movetodata.ai.library.models.UploadedFile;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class UploadedFileDto {

    @JsonProperty("fileId")
    private String fileId;

    @JsonProperty("filename")
    private String filename;

    @JsonProperty("originalFilename")
    private String originalFilename;

    @JsonProperty("contentType")
    private String contentType;

    @JsonProperty("sizeBytes")
    private Long sizeBytes;

    @JsonProperty("storagePath")
    private String storagePath;

    @JsonProperty("sheetName")
    private String sheetName;

    @JsonProperty("uploadedAt")
    private Instant uploadedAt;

    public static UploadedFileDto from(UploadedFile entity) {
        return UploadedFileDto.builder()
                .fileId(entity.getUuid())
                .filename(entity.getFilename())
                .originalFilename(entity.getOriginalFilename())
                .contentType(entity.getContentType())
                .sizeBytes(entity.getSizeBytes())
                .storagePath(entity.getStoragePath())
                .sheetName(entity.getSheetName())
                .uploadedAt(entity.getCreatedAt())
                .build();
    }
}
