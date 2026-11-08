package com.sillarvalley.ayni.address;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AddressDtos {

    private AddressDtos() {}

    public record AddressRequest(
            @Size(max = 40) String label,
            @Size(max = 200) String reference,
            @NotNull(message = "Marca el lugar en el mapa") @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull(message = "Marca el lugar en el mapa") @DecimalMin("-180") @DecimalMax("180") Double longitude) {

        public Address toEntity() {
            Address a = new Address();
            a.setLabel(label == null || label.isBlank() ? "Casa" : label.trim());
            a.setReference(reference == null || reference.isBlank() ? null : reference.trim());
            a.setLatitude(latitude);
            a.setLongitude(longitude);
            return a;
        }
    }

    public record AddressResponse(Long id, String label, String neighborhood, String reference,
                                  double latitude, double longitude, boolean primary, String icon) {
        public static AddressResponse of(Address a) {
            return new AddressResponse(a.getId(), a.getLabel(), a.getNeighborhood(), a.getReference(),
                    a.getLatitude(), a.getLongitude(), a.isPrimary(), AddressPlace.of(a.getLabel()).icon());
        }
    }
}
