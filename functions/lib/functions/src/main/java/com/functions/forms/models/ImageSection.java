package com.functions.forms.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class ImageSection extends FormSection {
  private String imageUrl;
  
  {
    setType(FormSectionType.IMAGE);
  }

  public boolean hasImageUrl() {
    return imageUrl != null && !imageUrl.isEmpty();
  }
}
