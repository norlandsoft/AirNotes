package com.norlandsoft.air.notes.commons;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TemplateUtils {
  private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");

  public static String readTemplate(String templatePath) {
    try (InputStream inputStream = TemplateUtils.class.getClassLoader().getResourceAsStream(templatePath)) {
      if (inputStream == null) {
        return templatePath;
      }
      return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException ioe) {
      return "";
    }
  }

  public static String replacePlaceholders(String template, Map<String, Object> parameters) {
    if (template == null || template.isEmpty()) {
      return template;
    }

    if (parameters == null || parameters.isEmpty()) {
      return template;
    }

    Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
    StringBuffer result = new StringBuffer();

    while (matcher.find()) {
      String placeholder = matcher.group(1).trim();
      Object value = parameters.get(placeholder);

      String replacement = value != null ? value.toString() : matcher.group(0);
      matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
    }

    matcher.appendTail(result);
    return result.toString();
  }

  public static String processTemplate(String templatePath, Map<String, Object> parameters) {
    String template = readTemplate(templatePath);
    return replacePlaceholders(template, parameters);
  }

  public static TemplateBuilder fromTemplate(String templatePath) {
    return new TemplateBuilder(readTemplate(templatePath));
  }

  public static TemplateBuilder fromContent(String templateContent) {
    return new TemplateBuilder(templateContent);
  }

  public static boolean containsPlaceholder(String template, String placeholder) {
    if (template == null || placeholder == null) {
      return false;
    }

    String placeholderPattern = "\\{\\{\\s*" + Pattern.quote(placeholder) + "\\s*\\}\\}";
    return Pattern.compile(placeholderPattern).matcher(template).find();
  }

  public static java.util.Set<String> getPlaceholders(String template) {
    java.util.Set<String> placeholders = new java.util.HashSet<>();

    if (template == null || template.isEmpty()) {
      return placeholders;
    }

    Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
    while (matcher.find()) {
      placeholders.add(matcher.group(1).trim());
    }

    return placeholders;
  }

  public static class TemplateBuilder {
    private String content;

    public TemplateBuilder(String content) {
      this.content = content != null ? content : "";
    }

    public TemplateBuilder replace(String placeholder, Object value) {
      if (placeholder == null || value == null) {
        return this;
      }

      String placeholderPattern = "\\{\\{\\s*" + Pattern.quote(placeholder) + "\\s*\\}\\}";
      this.content = this.content.replaceAll(placeholderPattern, Matcher.quoteReplacement(value.toString()));
      return this;
    }

    public TemplateBuilder replace(Map<String, Object> parameters) {
      if (parameters != null && !parameters.isEmpty()) {
        this.content = replacePlaceholders(this.content, parameters);
      }
      return this;
    }

    public String getContent() {
      return this.content;
    }

    public String build() {
      return this.content;
    }

    public boolean containsPlaceholder(String placeholder) {
      return TemplateUtils.containsPlaceholder(this.content, placeholder);
    }

    public java.util.Set<String> getPlaceholders() {
      return TemplateUtils.getPlaceholders(this.content);
    }

    public int getRemainingPlaceholdersCount() {
      return getPlaceholders().size();
    }

    public boolean isComplete() {
      return getRemainingPlaceholdersCount() == 0;
    }

    public TemplateBuilder reset(String templatePath) {
      this.content = readTemplate(templatePath);
      return this;
    }

    public TemplateBuilder resetContent(String content) {
      this.content = content != null ? content : "";
      return this;
    }

    @Override
    public String toString() {
      return this.content;
    }
  }
}
