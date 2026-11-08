package com.sillarvalley.ayni.business;

import com.sillarvalley.ayni.common.TextSearch;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(length = 1000)
    private String description;

    @Column(length = 15)
    private String phone;

    @Column(nullable = false, length = 120)
    private String neighborhood;

    @Column(length = 200)
    private String reference;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    private LocalTime opensAt;

    private LocalTime closesAt;

    @Column(length = 7)
    private String openDays;

    @Column(length = 80)
    private String priceHint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BusinessStatus status = BusinessStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by_id")
    private User moderatedBy;

    @Column(length = 500)
    private String moderationNote;

    @Column(nullable = false)
    private int recommendationsCount;

    @Column(nullable = false)
    private int goodPriceCount;

    @Column(nullable = false)
    private int punctualCount;

    @Column(nullable = false)
    private int reliableCount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String searchText = "";

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    @PreUpdate
    void refreshSearchText() {
        searchText = TextSearch.normalize(String.join(" ",
                name,
                description == null ? "" : description,
                neighborhood,
                category.getName(),
                category.getKeywords()));
    }

    public void addRecommendation(BusinessRecommendation r) {
        recommendationsCount++;
        if (r.isGoodPrice()) goodPriceCount++;
        if (r.isPunctual()) punctualCount++;
        if (r.isReliable()) reliableCount++;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String neighborhood) { this.neighborhood = neighborhood; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public LocalTime getOpensAt() { return opensAt; }
    public void setOpensAt(LocalTime opensAt) { this.opensAt = opensAt; }
    public LocalTime getClosesAt() { return closesAt; }
    public void setClosesAt(LocalTime closesAt) { this.closesAt = closesAt; }
    public String getOpenDays() { return openDays; }
    public void setOpenDays(String openDays) { this.openDays = openDays; }
    public String getPriceHint() { return priceHint; }
    public void setPriceHint(String priceHint) { this.priceHint = priceHint; }
    public BusinessStatus getStatus() { return status; }
    public void setStatus(BusinessStatus status) { this.status = status; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public User getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(User moderatedBy) { this.moderatedBy = moderatedBy; }
    public String getModerationNote() { return moderationNote; }
    public void setModerationNote(String moderationNote) { this.moderationNote = moderationNote; }
    public int getRecommendationsCount() { return recommendationsCount; }
    public int getGoodPriceCount() { return goodPriceCount; }
    public int getPunctualCount() { return punctualCount; }
    public int getReliableCount() { return reliableCount; }
    public String getSearchText() { return searchText; }
    public Instant getCreatedAt() { return createdAt; }
}
