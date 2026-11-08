package com.sillarvalley.ayni.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NeighborhoodRepository extends JpaRepository<Neighborhood, Long> {

    List<Neighborhood> findAllByOrderBySortOrderAsc();
}
