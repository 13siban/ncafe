package com.new_cafe.app.backend.order.domain.model;

public enum OrderType {
    PICKUP("포장(일회용기)"),
    STORE("매장(다회용기)");

    private final String description;

    OrderType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
