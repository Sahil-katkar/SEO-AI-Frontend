import { createClient } from "../../utils/supabase/server";

export default async function Instruments() {
  const supabase = await createClient();

  const row_id = "123";
  const article = await supabase
    .from("article")
    .select("content")
    .eq("row_id", row_id);
  const intent = await supabase
    .from("intent")
    .select("content")
    .eq("row_id", row_id);
  const outline = await supabase
    .from("outline")
    .select("content")
    .eq("row_id", row_id);

  const articledata = article.data || [];
  const intentdata = intent.data || [];
  const outlineData = outline.data || [];

  return (
    <>
      <div>
        <h1>Article Data</h1>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>#</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>
            {articledata.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br />

      <div>
        <h1>Intent Data</h1>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>#</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>
            {intentdata.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h1>Outline Data</h1>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>#</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody>
          {outlineData.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
