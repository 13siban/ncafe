package com.new_cafe.app.backend.order.application.port.out;

public interface OrderOptionRepositoryPort {
    void saveSelections(Long orderItemId, java.util.List<OptionSelectionData> selections);

    record OptionSelectionData(String optionGroupName, String optionItemName, Integer priceDelta) {}
}
