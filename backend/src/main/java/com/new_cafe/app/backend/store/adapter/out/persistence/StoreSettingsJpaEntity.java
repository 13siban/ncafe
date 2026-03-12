package com.new_cafe.app.backend.store.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class StoreSettingsJpaEntity {

    @Id
    private Integer id;

    @Column(name = "is_open", nullable = false)
    private Boolean isOpen;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "open_time")
    private String openTime;

    @Column(name = "close_time")
    private String closeTime;

    @Column(name = "cafe_name")
    private String cafeName;

    @Column(name = "description")
    private String description;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "favicon_dark_url")
    private String faviconDarkUrl;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public void setOpen(boolean open) {
        this.isOpen = open;
        if (open) {
            this.openedAt = LocalDateTime.now();
        } else {
            this.closedAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) id = 1;
        if (isOpen == null) isOpen = false;
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
