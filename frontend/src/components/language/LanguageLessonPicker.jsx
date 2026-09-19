import PropTypes from "prop-types";
import "./LanguageTutorFrame.css";

export default function LanguageLessonPicker({ lessons, value, onChange, getLabel, className = "language-lesson-picker", selectClassName = "", style, selectStyle }) {
  return (
    <section className={className} style={style}>
      <label>
        <strong>Saved lesson category</strong>
        <select className={selectClassName} style={selectStyle} value={value} onChange={(event) => onChange(event.target.value)}>
          {lessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{getLabel(lesson)}</option>)}
        </select>
      </label>
    </section>
  );
}

LanguageLessonPicker.propTypes = {
  lessons: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  className: PropTypes.string,
  selectClassName: PropTypes.string,
  style: PropTypes.object,
  selectStyle: PropTypes.object,
};
