interface AccessibilitySkipNavigation {
  targetId?: string;
  text?: string;
}

export default function AccessibilitySkipNavigation({
  targetId = "main-content",
  text = "Skip to main content",
}: AccessibilitySkipNavigation) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium z-[60] transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 hover:bg-blue-700"
    >
      {text}
    </a>
  );
}
