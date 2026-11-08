package com.sillarvalley.ayni.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.BatchSize;

// "users" (plural) porque "user" es palabra reservada en PostgreSQL.
@Entity
@Table(name = "users")
@BatchSize(size = 50) // evita N+1 al listar publicaciones con su autor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String fullName;

    /** Normalizado con código de país: 51987654321 */
    @Column(nullable = false, unique = true, length = 15)
    private String phone;

    @Column(unique = true, length = 160)
    private String email;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.NEIGHBOR;

    @Column(nullable = false)
    private boolean active = true;

    /** Reputación "ayni": puntos por ayudar. */
    @Column(nullable = false)
    private int ayniPoints;

    @Column(nullable = false)
    private int helpGiven;

    @Column(nullable = false)
    private int helpReceived;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getAyniPoints() { return ayniPoints; }
    public void setAyniPoints(int ayniPoints) { this.ayniPoints = ayniPoints; }
    public int getHelpGiven() { return helpGiven; }
    public void setHelpGiven(int helpGiven) { this.helpGiven = helpGiven; }
    public int getHelpReceived() { return helpReceived; }
    public void setHelpReceived(int helpReceived) { this.helpReceived = helpReceived; }
    public Instant getCreatedAt() { return createdAt; }
}
