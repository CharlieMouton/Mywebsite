# Decorative SVGs

Place personalized SVG drawings here for use as embellishments throughout the portfolio.

**Usage:** Add `data-svg="decorative/filename.svg"` to any component that supports it (hero, title, subtitle, text).

**Example:**
```html
<div data-component="title" data-text="Section Title" data-svg="decorative/divider.svg"></div>
```

The loader injects the SVG as an `<img>` into the component's `[data-svg-slot]` element.
