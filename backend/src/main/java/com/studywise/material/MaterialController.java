package com.studywise.material;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {
    private final StudyMaterialRepository repo;

    public MaterialController(StudyMaterialRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<MaterialView> list(@RequestParam(defaultValue = "") String search) {
        var items = search.isBlank()
                ? repo.findAllByOrderByUploadedAtDesc()
                : repo.findByNameContainingIgnoreCaseOrderByUploadedAtDesc(search.trim());
        return items.stream().map(MaterialView::from).toList();
    }

    @GetMapping("/{id}")
    public MaterialDetail getOne(@PathVariable Long id) {
        var m = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found."));
        return new MaterialDetail(m.getId(), m.getName(), m.getFileType(), m.getSizeBytes(), m.getUploadedAt(), m.getContent());
    }

    @PostMapping
    public MaterialView upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a file to upload.");
        }
        String name = Optional.ofNullable(file.getOriginalFilename()).orElse("notes.txt");
        String lower = name.toLowerCase(Locale.ROOT);
        String content;
        String type;
        try {
            if (lower.endsWith(".pdf")) {
                try (var pdf = Loader.loadPDF(file.getBytes())) {
                    content = new PDFTextStripper().getText(pdf);
                }
                type = "PDF";
            } else if (lower.endsWith(".docx")) {
                try (var doc = new XWPFDocument(new ByteArrayInputStream(file.getBytes()))) {
                    content = doc.getParagraphs().stream().map(p -> p.getText()).reduce((a, b) -> a + "\n" + b).orElse("");
                }
                type = "DOCX";
            } else if (lower.endsWith(".txt")) {
                content = new String(file.getBytes(), StandardCharsets.UTF_8);
                type = "TXT";
            } else {
                throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Supported file types are PDF, DOCX, and TXT.");
            }
            if (content.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No readable text was found in this file.");
            }
            if (content.length() > 1_000_000) {
                content = content.substring(0, 1_000_000);
            }
            return MaterialView.from(repo.save(new StudyMaterial(name, type, file.getSize(), content)));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read this file. Check that it is a valid PDF, DOCX, or TXT.", e);
        }
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found.");
        }
        repo.deleteById(id);
        return Map.of("message", "Material deleted.");
    }

    public record MaterialView(Long id, String name, String fileType, long sizeBytes, Instant uploadedAt) {
        static MaterialView from(StudyMaterial m) {
            return new MaterialView(m.getId(), m.getName(), m.getFileType(), m.getSizeBytes(), m.getUploadedAt());
        }
    }

    public record MaterialDetail(Long id, String name, String fileType, long sizeBytes, Instant uploadedAt, String content) {}
}
