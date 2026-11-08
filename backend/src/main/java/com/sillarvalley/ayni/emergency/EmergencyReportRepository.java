package com.sillarvalley.ayni.emergency;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyReportRepository extends JpaRepository<EmergencyReport, Long> {

    List<EmergencyReport> findTop100ByOrderByCreatedAtDesc();

    long countByStatusNot(EmergencyStatus status);
}
