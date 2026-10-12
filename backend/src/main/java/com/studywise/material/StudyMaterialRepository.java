package com.studywise.material;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface StudyMaterialRepository extends JpaRepository<StudyMaterial,Long>{List<StudyMaterial> findAllByOrderByUploadedAtDesc();List<StudyMaterial> findByNameContainingIgnoreCaseOrderByUploadedAtDesc(String name);}
