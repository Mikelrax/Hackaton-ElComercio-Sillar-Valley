package com.sillarvalley.ayni.emergency;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportPointRepository extends JpaRepository<SupportPoint, Long> {

    List<SupportPoint> findAllByOrderByNameAsc();

    Optional<SupportPoint> findFirstByName(String name);

    long countByOpenTrue();
}
