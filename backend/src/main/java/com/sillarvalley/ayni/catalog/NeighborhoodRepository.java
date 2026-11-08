package com.sillarvalley.ayni.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NeighborhoodRepository extends JpaRepository<Neighborhood, Long> {

    List<Neighborhood> findAllByOrderBySortOrderAsc();

    Optional<Neighborhood> findByNameIgnoreCase(String name);
}
