package io.movetodata.ai.library.repository;

import io.movetodata.ai.library.models.UploadedFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    Optional<UploadedFile> findByUuidAndDeletedAtIsNull(String uuid);

    List<UploadedFile> findAllByUserIdAndDeletedAtIsNull(UUID userId);
}
