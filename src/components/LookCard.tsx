import { CoSponsorLogos, LogoFields } from './LogoFields';
import { FontFields } from './FontFields';
import { SelectField } from './fields';
import { TemplateCards } from './TemplateCards';
import { ThemeField } from './ThemeField';

/**
 * How the signs look, under the preview: template cards and colors up front; fonts, text style
 * and logos under "More design options".
 */
export function LookCard() {
  return (
    <section className="card look" aria-labelledby="look-heading">
      <h2 id="look-heading">Look</h2>
      <TemplateCards />
      <ThemeField />
      <details className="more-options">
        <summary>More design options</summary>
        <div className="more-groups">
          <section className="more-group" aria-labelledby="more-fonts">
            <h4 id="more-fonts">Fonts</h4>
            <FontFields />
          </section>
          <section className="more-group" aria-labelledby="more-text">
            <h4 id="more-text">Text style</h4>
            <SelectField
              name="dateStyle"
              label="Date style"
              options={[
                { value: 'auto', label: 'Automatic (stacked on portrait formats)' },
                { value: 'inline', label: 'Inline (Fri, Oct 23)' },
                { value: 'stacked', label: 'Stacked (Fri / 23 / Oct)' },
              ]}
            />
            <SelectField
              name="weekdayStyle"
              label="Weekday"
              options={[
                { value: 'short', label: 'Short (Fri)' },
                { value: 'long', label: 'Full (Friday)' },
                { value: 'none', label: 'None' },
              ]}
            />
            <SelectField
              name="highlightStyle"
              label="Highlights style"
              hint="How highlights stand out from the other details."
              options={[
                { value: 'bold-color', label: 'Bold and color' },
                { value: 'bold', label: 'Bold' },
                { value: 'color', label: 'Color' },
              ]}
            />
          </section>
          <section className="more-group" aria-labelledby="more-logos">
            <h4 id="more-logos">Logos</h4>
            <LogoFields />
            <CoSponsorLogos />
          </section>
        </div>
      </details>
    </section>
  );
}
