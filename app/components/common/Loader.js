export default function Loader({className}) {
  return (
    // <div className="loader-container">
    <div className={`${className ? className : "loader"}`}></div>
    // </div>
  );
}
