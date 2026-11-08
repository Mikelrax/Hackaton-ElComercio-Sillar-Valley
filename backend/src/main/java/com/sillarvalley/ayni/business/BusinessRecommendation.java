package com.sillarvalley.ayni.business;

import com.sillarvalley.ayni.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "business_recommendations")
public class BusinessRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private boolean goodPrice;

    @Column(nullable = false)
    private boolean punctual;

    @Column(nullable = false)
    private boolean reliable;

    @Column(length = 500)
    private String comment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public boolean isGoodPrice() { return goodPrice; }
    public void setGoodPrice(boolean goodPrice) { this.goodPrice = goodPrice; }
    public boolean isPunctual() { return punctual; }
    public void setPunctual(boolean punctual) { this.punctual = punctual; }
    public boolean isReliable() { return reliable; }
    public void setReliable(boolean reliable) { this.reliable = reliable; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Instant getCreatedAt() { return createdAt; }
}
