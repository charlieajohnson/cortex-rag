export default function QuestionBubble({ text }) {
  return (
    <div className="message message-question" style={{ animationDelay: "0.05s" }}>
      <div className="question-bubble">{text}</div>
    </div>
  );
}
