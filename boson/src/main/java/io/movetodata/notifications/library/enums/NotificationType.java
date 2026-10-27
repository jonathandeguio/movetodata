package io.movetodata.notifications.library.enums;

public enum NotificationType {
    MENTION("MENTION"),
    ACCESS_REQUEST("ACCESS_REQUEST"),
    CATALOG_DRIFT("CATALOG_DRIFT"),
    CATALOG_TRUST_LOW("CATALOG_TRUST_LOW");

    private final String displayName;

    NotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

