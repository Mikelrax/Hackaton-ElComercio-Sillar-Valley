package com.sillarvalley.ayni.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "neighborhoods")
public class Neighborhood {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false)
    private int sortOrder;

    private Double latitude;

    private Double longitude;

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getSortOrder() { return sortOrder; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
}
