package com.sillarvalley.ayni.emergency;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyReportRepository extends JpaRepository<EmergencyReport, Long> {

    List<EmergencyReport> findTop200ByOrderByCreatedAtDesc();

    long countByKindAndStatusIn(EmergencyKind kind, Collection<EmergencyStatus> statuses);

    Optional<EmergencyReport> findFirstByTitle(String title);
}
