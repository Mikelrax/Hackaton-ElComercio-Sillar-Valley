package com.sillarvalley.ayni.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NeighborhoodRepository extends JpaRepository<Neighborhood, Long> {

    List<Neighborhood> findAllByOrderBySortOrderAsc();

    Optional<Neighborhood> findByNameIgnoreCase(String name);

    @Query(value = "SELECT * FROM neighborhoods"
            + " ORDER BY geog <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography LIMIT 1",
            nativeQuery = true)
    Optional<Neighborhood> findNearest(@Param("lat") double latitude, @Param("lng") double longitude);
}
