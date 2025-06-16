package com.functions.comments.models.requests;

import com.functions.comments.models.UserComment;

public record CreateUserCommentRequest(String targetUserId, UserComment comment) {}
