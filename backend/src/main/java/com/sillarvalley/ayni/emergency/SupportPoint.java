package com.sillarvalley.ayni.emergency;

import com.sillarvalley.ayni.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Collection;
import java.util.Set;

@Entity
@Table(name = "support_points")
public class SupportPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportPointType type;

    @Column(nullable = false, length = 120)
    private String neighborhood;

    @Column(length = 200)
    private String address;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "is_open", nullable = false)
    private boolean open = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(length = 200)
    private String resources;

    @Column(length = 60)
    private String hours;

    public Long getId() { return id; }
    public Set<SupportResource> getResources() { return EnumCsv.parse(SupportResource.class, resources); }
    public void setResources(Collection<SupportResource> values) { this.resources = EnumCsv.join(values); }
    public boolean hasResources() { return resources != null; }
    public String getHours() { return hours; }
    public void setHours(String hours) { this.hours = hours; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public SupportPointType getType() { return type; }
    public void setType(SupportPointType type) { this.type = type; }
    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String neighborhood) { this.neighborhood = neighborhood; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public boolean isOpen() { return open; }
    public void setOpen(boolean open) { this.open = open; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
