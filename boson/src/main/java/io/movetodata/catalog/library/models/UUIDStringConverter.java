package io.movetodata.catalog.library.models;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.util.UUID;

/**
 * Converts between String (Java) and UUID (PostgreSQL) for columns declared
 * columnDefinition = "uuid". Without this, Hibernate sends the value as
 * character varying and PostgreSQL rejects the comparison (uuid = varchar).
 */
@Converter
public class UUIDStringConverter implements AttributeConverter<String, UUID> {

    @Override
    public UUID convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) return null;
        return UUID.fromString(attribute);
    }

    @Override
    public String convertToEntityAttribute(UUID dbData) {
        return dbData != null ? dbData.toString() : null;
    }
}
