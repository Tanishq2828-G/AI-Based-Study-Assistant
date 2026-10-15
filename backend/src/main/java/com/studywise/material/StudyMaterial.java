package com.studywise.material;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "study_materials")
public class StudyMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(nullable = false, length = 50_000_000)
    private String content;

    protected StudyMaterial() {}

    public StudyMaterial(String name, String fileType, long sizeBytes, String content) {
        this.name = name;
        this.fileType = fileType;
        this.sizeBytes = sizeBytes;
        this.content = content;
        this.uploadedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getFileType() { return fileType; }
    public long getSizeBytes() { return sizeBytes; }
    public Instant getUploadedAt() { return uploadedAt; }
    public String getContent() { return content; }
}
