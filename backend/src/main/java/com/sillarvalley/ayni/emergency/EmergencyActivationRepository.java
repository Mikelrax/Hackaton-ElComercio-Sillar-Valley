package com.sillarvalley.ayni.emergency;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyActivationRepository extends JpaRepository<EmergencyActivation, Long> {

    Optional<EmergencyActivation> findFirstByActiveTrueOrderByActivatedAtDesc();
}
