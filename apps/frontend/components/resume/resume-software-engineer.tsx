import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';
import type {
  ResumeData,
  SectionMeta,
  AdditionalSectionLabels,
} from '@/components/dashboard/resume-component';
import { getSortedSections } from '@/lib/utils/section-helpers';
import { formatDateRange } from '@/lib/utils';
import { SkillRows } from './skill-rows';
import { getTechnicalSkills } from '@/lib/utils/skill-rows';
import { DescriptionList } from './description-list';
import baseStyles from './styles/_base.module.css';
import styles from './styles/software-engineer.module.css';

interface ResumeSoftwareEngineerProps {
  data: ResumeData;
  showContactIcons?: boolean;
  additionalSectionLabels?: Partial<AdditionalSectionLabels>;
}

function getRepositoryName(link: string): string {
  try {
    const url = new URL(link.startsWith('http') ? link : `https://${link}`);
    const segments = url.pathname.split('/').filter(Boolean);
    return (segments[1] || segments[0] || 'GitHub').replace(/\.git$/, '');
  } catch {
    return 'GitHub';
  }
}

/**
 * Software Engineer Resume Template
 *
 * Starts as a clone of Clean, with its own markup and styles for future customization.
 *
 * Minimal modern sans layout: centered light-weight name, a single pipe-separated
 * contact line, large understated gray UPPERCASE section headers with a thin rule,
 * and single-line entries (COMPANY | Role on the left, Location | Dates on the right).
 *
 * Single-typeface design: all text inherits `--body-font` (sans by default), so the
 * Body Font control drives the whole template. ATS-safe (all text is real DOM nodes).
 *
 * Section order: Determined by sectionMeta ordering.
 */
export const ResumeSoftwareEngineer: React.FC<ResumeSoftwareEngineerProps> = ({
  data,
  showContactIcons = false,
  additionalSectionLabels,
}) => {
  const { personalInfo, summary, workExperience, education, personalProjects, additional } = data;

  const sortedSections = getSortedSections(data);

  const contactIcons: Record<string, React.ReactNode> = {
    Email: <Mail size={12} />,
    Phone: <Phone size={12} />,
    Location: <MapPin size={12} />,
    Website: <Globe size={12} />,
    LinkedIn: <Linkedin size={12} />,
    GitHub: <Github size={12} />,
  };

  const renderContactDetail = (
    label: string,
    value?: string,
    hrefPrefix: string = ''
  ): React.ReactNode => {
    if (!value) return null;

    if (label === 'Email') {
      const addresses = value.split(/[\s,]+/).filter(Boolean);
      if (addresses.length > 1) {
        return (
          <span className="inline-flex items-center gap-2">
            {addresses.map((address, index) => (
              <React.Fragment key={`${address}-${index}`}>
                {index > 0 && <span aria-hidden="true">|</span>}
                {renderContactDetail('Email', address, hrefPrefix)}
              </React.Fragment>
            ))}
          </span>
        );
      }
    }

    let finalHrefPrefix = hrefPrefix;
    if (
      ['Website', 'LinkedIn', 'GitHub'].includes(label) &&
      !value.startsWith('http') &&
      !value.startsWith('//')
    ) {
      finalHrefPrefix = 'https://';
    }

    const href = finalHrefPrefix + value;
    const isLink =
      finalHrefPrefix.startsWith('http') ||
      finalHrefPrefix.startsWith('mailto:') ||
      finalHrefPrefix.startsWith('tel:');

    let displayText = value;
    if (isLink && (label === 'LinkedIn' || label === 'GitHub' || label === 'Website')) {
      displayText = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }

    return (
      <span className="inline-flex items-center gap-1">
        {showContactIcons && contactIcons[label]}
        {isLink ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseStyles['resume-link']} hover:underline`}
          >
            {displayText}
          </a>
        ) : (
          <span
            className={
              label === 'Location' ? 'underline underline-offset-[3px] decoration-1' : undefined
            }
          >
            {displayText}
          </span>
        )}
      </span>
    );
  };

  const contactItems = [
    renderContactDetail('Phone', personalInfo?.phone, 'tel:'),
    renderContactDetail('Email', personalInfo?.email, 'mailto:'),
    renderContactDetail('LinkedIn', personalInfo?.linkedin),
    renderContactDetail('GitHub', personalInfo?.github),
    renderContactDetail('Website', personalInfo?.website),
    renderContactDetail('Location', personalInfo?.location),
  ].filter(Boolean);

  // Single-line entry header: COMPANY | Role (left), Location | Dates (right).
  const renderEntryHeader = (
    primary?: string,
    role?: string,
    location?: string,
    dates?: string
  ) => {
    const meta = [location, dates ? formatDateRange(dates) : undefined].filter(Boolean).join(' | ');
    return (
      <div
        className={`flex justify-between items-baseline gap-3 ${baseStyles['resume-row-tight']}`}
      >
        <span className="min-w-0">
          <span className={styles.entryCompany}>{primary}</span>
          {role && (
            <>
              <span className={styles.sep}>|</span>
              <span className={styles.entryRole}>{role}</span>
            </>
          )}
        </span>
        {meta && <span className={styles.entryMeta}>{meta}</span>}
      </div>
    );
  };

  const renderBullets = (items?: string[], pointStyles?: ('bullet' | 'plain')[]) => (
    <DescriptionList items={items} styles={pointStyles} />
  );

  const renderSection = (section: SectionMeta) => {
    switch (section.key) {
      case 'personalInfo':
        return null;

      case 'summary':
        if (!summary) return null;
        return (
          <div key={section.id} className={baseStyles['resume-section']}>
            <h3 className={styles.sectionTitle}>{section.displayName}</h3>
            <p className={`text-left ${baseStyles['resume-text']}`}>{summary}</p>
          </div>
        );

      case 'workExperience':
        if (!workExperience || workExperience.length === 0) return null;
        return (
          <div key={section.id} className={baseStyles['resume-section']}>
            <h3 className={styles.sectionTitle}>{section.displayName}</h3>
            <div className={baseStyles['resume-items']}>
              {workExperience.map((exp) => (
                <div key={exp.id} className={baseStyles['resume-item']}>
                  {renderEntryHeader(exp.company, exp.title, exp.location, exp.years)}
                  {renderBullets(exp.description, exp.descriptionStyles)}
                </div>
              ))}
            </div>
          </div>
        );

      case 'personalProjects':
        if (!personalProjects || personalProjects.length === 0) return null;
        return (
          <div key={section.id} className={baseStyles['resume-section']}>
            <h3 className={styles.sectionTitle}>{section.displayName}</h3>
            <div className={baseStyles['resume-items']}>
              {personalProjects.map((project) => (
                <div key={project.id} className={baseStyles['resume-item']}>
                  <div className={`${styles.projectHeader} ${baseStyles['resume-row-tight']}`}>
                    <span className={styles.entryCompany}>
                      {project.name}
                      {project.label && (
                        <span className={styles.projectLabel}>{project.label}</span>
                      )}
                    </span>
                    <span className={styles.projectMeta}>
                      {[
                        project.github ? (
                          <a
                            key="github"
                            href={
                              project.github.startsWith('http')
                                ? project.github
                                : `https://${project.github}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${baseStyles['resume-link']} inline-flex items-center gap-1`}
                          >
                            <Github size={10} className="shrink-0" aria-hidden="true" />
                            {getRepositoryName(project.github)}
                          </a>
                        ) : null,
                        project.website ? (
                          <a
                            key="website"
                            href={
                              project.website.startsWith('http')
                                ? project.website
                                : `https://${project.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${baseStyles['resume-link']} inline-flex items-center gap-1`}
                          >
                            {project.website
                              .replace(/^https?:\/\//, '')
                              .replace(/^www\./, '')
                              .replace(/\/$/, '')}
                            {/* Material Symbols by Google: https://github.com/google/material-design-icons/blob/master/LICENSE */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={10}
                              height={10}
                              viewBox="0 0 24 24"
                              className="shrink-0 translate-y-[2px]"
                              aria-hidden="true"
                            >
                              <path
                                fill="currentColor"
                                d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z"
                              />
                            </svg>
                          </a>
                        ) : null,
                        project.years ? (
                          <span key="dates" className={styles.entryMeta}>
                            {formatDateRange(project.years)}
                          </span>
                        ) : null,
                      ]
                        .filter(Boolean)
                        .map((item, index) => (
                          <React.Fragment key={item!.key}>
                            {index > 0 && <span className={styles.sep}>|</span>}
                            {item}
                          </React.Fragment>
                        ))}
                    </span>
                  </div>
                  {project.role && <div className={styles.entryRole}>{project.role}</div>}
                  <DescriptionList items={project.description} styles={project.descriptionStyles} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (!education || education.length === 0) return null;
        return (
          <div key={section.id} className={baseStyles['resume-section']}>
            <h3 className={styles.sectionTitle}>{section.displayName}</h3>
            <div className={baseStyles['resume-items']}>
              {education.map((edu) => (
                <div key={edu.id} className={baseStyles['resume-item']}>
                  <div
                    className={`flex justify-between items-baseline gap-3 ${baseStyles['resume-row-tight']}`}
                  >
                    <span className="inline-flex min-w-0 items-baseline gap-2">
                      <span className={styles.entryCompany}>{edu.institution}</span>
                      {edu.location && (
                        <>
                          <span className={styles.educationSep}>|</span>
                          <span className={styles.educationLocation}>{edu.location}</span>
                        </>
                      )}
                    </span>
                    {edu.years && (
                      <span className={styles.entryMeta}>{formatDateRange(edu.years)}</span>
                    )}
                  </div>
                  {edu.degree && <p className={baseStyles['resume-text-sm']}>{edu.degree}</p>}
                  {edu.description && (
                    <p className={baseStyles['resume-text-sm']}>{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'additional':
        if (!additional) return null;
        return (
          <AdditionalSection
            key={section.id}
            additional={additional}
            displayName={section.displayName}
            labels={additionalSectionLabels}
          />
        );

      default:
        if (!section.isDefault) {
          return (
            <DynamicResumeSectionClean
              key={section.id}
              sectionMeta={section}
              resumeData={data}
              renderBullets={renderBullets}
              renderEntryHeader={renderEntryHeader}
            />
          );
        }
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {personalInfo && (
        <header className={`text-center ${baseStyles['resume-header']}`}>
          {personalInfo.name && <h1 className={`${styles.name} mb-0.5`}>{personalInfo.name}</h1>}
          {personalInfo.title && (
            <div className={`${styles.tagline} mb-1`}>{personalInfo.title}</div>
          )}
          {contactItems.length > 0 && (
            <div
              className={`flex flex-wrap justify-center items-center gap-x-2 gap-y-1 ${styles.contactRow}`}
            >
              {contactItems.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className={styles.sep}>|</span>}
                  {item}
                </React.Fragment>
              ))}
            </div>
          )}
        </header>
      )}

      {sortedSections
        .filter((section) => section.key !== 'personalInfo')
        .map((section) => renderSection(section))}
    </div>
  );
};

/**
 * Additional info section (skills, languages, certifications, awards).
 * Medium-weight inline label followed by comma-joined items, one line per category.
 */
const AdditionalSection: React.FC<{
  additional: ResumeData['additional'];
  displayName?: string;
  labels?: Partial<AdditionalSectionLabels>;
}> = ({ additional, displayName = 'Skills & Awards', labels }) => {
  if (!additional) return null;

  const clean = (items?: string[]) =>
    (items ?? []).filter((item): item is string => typeof item === 'string' && item.trim() !== '');

  const technicalSkills = getTechnicalSkills(additional);
  const languages = clean(additional.languages);
  const certificationsTraining = clean(additional.certificationsTraining);
  const awards = clean(additional.awards);

  const mergedLabels: AdditionalSectionLabels = {
    technicalSkills: labels?.technicalSkills ?? 'Technical Skills:',
    languages: labels?.languages ?? 'Languages:',
    certifications: labels?.certifications ?? 'Certifications:',
    awards: labels?.awards ?? 'Awards:',
  };

  const hasContent =
    technicalSkills.length > 0 ||
    languages.length > 0 ||
    certificationsTraining.length > 0 ||
    awards.length > 0;

  if (!hasContent) return null;

  const line = (label: string, items: string[]) =>
    items.length > 0 ? (
      <div>
        <span className={styles.skillLabel}>{label}</span> {items.join(', ')}
      </div>
    ) : null;

  return (
    <>
      {technicalSkills.length > 0 && (
        <div className={baseStyles['resume-section']}>
          <h3 className={styles.sectionTitle}>{displayName}</h3>
          <div className={`${baseStyles['resume-stack']} ${baseStyles['resume-text-sm']}`}>
            {Array.isArray(additional.skillRows) ? (
              <SkillRows rows={additional.skillRows} headingClassName={styles.skillLabel} />
            ) : (
              line(mergedLabels.technicalSkills, technicalSkills)
            )}
          </div>
        </div>
      )}
      {(languages.length > 0 || certificationsTraining.length > 0 || awards.length > 0) && (
        <div className={baseStyles['resume-section']}>
          <h3 className={styles.sectionTitle}>
            {additional.otherInfoHeading?.trim() || 'Languages, Certifications & Awards'}
          </h3>
          <div className={`${styles.additionalColumns} ${baseStyles['resume-text-sm']}`}>
            {line(mergedLabels.languages, languages)}
            {line(mergedLabels.certifications, certificationsTraining)}
            {line(mergedLabels.awards, awards)}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Dynamic (custom) section wrapper for the Clean template.
 */
const DynamicResumeSectionClean: React.FC<{
  sectionMeta: SectionMeta;
  resumeData: ResumeData;
  renderBullets: (items?: string[], pointStyles?: ('bullet' | 'plain')[]) => React.ReactNode;
  renderEntryHeader: (
    primary?: string,
    role?: string,
    location?: string,
    dates?: string
  ) => React.ReactNode;
}> = ({ sectionMeta, resumeData, renderBullets, renderEntryHeader }) => {
  const customSection = resumeData.customSections?.[sectionMeta.key];
  if (!customSection) return null;

  const hasContent = (() => {
    switch (sectionMeta.sectionType) {
      case 'text':
        return Boolean(customSection.text?.trim());
      case 'itemList':
        return Boolean(customSection.items?.length);
      case 'stringList':
        return Boolean(customSection.strings?.length);
      default:
        return false;
    }
  })();

  if (!hasContent) return null;

  return (
    <div className={baseStyles['resume-section']}>
      <h3 className={styles.sectionTitle}>{sectionMeta.displayName}</h3>
      {sectionMeta.sectionType === 'text' && customSection.text?.trim() && (
        <p className={`text-justify ${baseStyles['resume-text']}`}>{customSection.text}</p>
      )}
      {sectionMeta.sectionType === 'itemList' && customSection.items?.length ? (
        <div className={baseStyles['resume-items']}>
          {customSection.items.map((item) => (
            <div key={item.id} className={baseStyles['resume-item']}>
              {renderEntryHeader(item.title, item.subtitle, item.location, item.years)}
              {renderBullets(item.description, item.descriptionStyles)}
            </div>
          ))}
        </div>
      ) : null}
      {sectionMeta.sectionType === 'stringList' && customSection.strings?.length ? (
        <div className={baseStyles['resume-text-sm']}>{customSection.strings.join(', ')}</div>
      ) : null}
    </div>
  );
};

export default ResumeSoftwareEngineer;
