package com.studywise.study;

import com.studywise.material.StudyMaterialRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study")
public class StudyController {
    private final StudyMaterialRepository materials;
    private final StudyService study;

    public StudyController(StudyMaterialRepository m, StudyService s) {
        this.materials = m;
        this.study = s;
    }

    @PostMapping("/{id}/summary")
    public Map<String, String> summary(@PathVariable Long id) {
        return Map.of("summary", study.summarize(content(id)));
    }

    @PostMapping("/{id}/topics")
    public Map<String, List<String>> topics(@PathVariable Long id) {
        return Map.of("topics", study.topics(content(id)));
    }

    @PostMapping("/{id}/flashcards")
    public Map<String, List<StudyService.Flashcard>> flashcards(@PathVariable Long id) {
        return Map.of("flashcards", study.flashcards(content(id)));
    }

    @PostMapping("/{id}/ask")
    public Map<String, String> ask(@PathVariable Long id, @Valid @RequestBody AskRequest r) {
        return Map.of("answer", study.answer(content(id), r.question()));
    }

    @PostMapping("/{id}/quiz")
    public Map<String, List<QuizQuestion>> quiz(@PathVariable Long id, @RequestBody(required = false) QuizRequest r) {
        return Map.of("questions", study.quiz(content(id), r == null || r.count() == null ? 5 : r.count()));
    }

    private String content(Long id) {
        return materials.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found.")).getContent();
    }

    public record AskRequest(@NotBlank String question) {}
    public record QuizRequest(Integer count) {}
    public record QuizQuestion(String question, List<String> options, int answerIndex, String explanation) {}
}
