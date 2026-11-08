package com.sillarvalley.ayni.emergency;

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
@Table(name = "emergency_activations")
public class EmergencyActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(length = 2000)
    private String message;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activated_by_id", nullable = false)
    private User activatedBy;

    @Column(nullable = false, updatable = false)
    private Instant activatedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deactivated_by_id")
    private User deactivatedBy;

    private Instant deactivatedAt;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public User getActivatedBy() { return activatedBy; }
    public void setActivatedBy(User activatedBy) { this.activatedBy = activatedBy; }
    public Instant getActivatedAt() { return activatedAt; }
    public User getDeactivatedBy() { return deactivatedBy; }
    public void setDeactivatedBy(User deactivatedBy) { this.deactivatedBy = deactivatedBy; }
    public Instant getDeactivatedAt() { return deactivatedAt; }
    public void setDeactivatedAt(Instant deactivatedAt) { this.deactivatedAt = deactivatedAt; }
}
