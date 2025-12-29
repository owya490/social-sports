package com.functions.forms.models.requests;

import com.functions.forms.models.FormResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveTempFormResponseRequest {
        private FormResponse formResponse;
}
