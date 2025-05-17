package com.functions.comments.models;

public class UserComment{
    private String authorId;
    private String comment;
    private long timestamp;

    public UserComment() {
    }

    public UserComment(String authorId, String comment, long timestamp) {
        this.authorId = authorId;
        this.comment = comment;
        this.timestamp = timestamp;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
