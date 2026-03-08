package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "option_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionGroupJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "type", nullable = false, length = 20)
    private String type; // 'radio' or 'checkbox'

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
