package com.functions.forms.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class FileUploadSection extends FormSection {
    private String fileUrl;

    {
        setType(FormSectionType.FILE_UPLOAD);
    }

    public boolean hasFileUrl() {
        return fileUrl != null && !fileUrl.isEmpty();
    }
}
