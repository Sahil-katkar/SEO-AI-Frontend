"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");

  // Fetch todos on mount
  useEffect(() => {
    async function fetchTodos() {
      const { data, error } = await supabase.from("todos").select("*");
      if (error) {
        console.error("Error fetching todos:", error);
      } else {
        setTodos(data);
      }
    }
    fetchTodos();
  }, []);

  // Add a new todo
  async function addTodo() {
    if (!newTask) return;
    const { data, error } = await supabase
      .from("todos")
      .insert([{ task: newTask }])
      .select();
    if (error) {
      console.error("Error adding todo:", error);
    } else {
      setTodos([...todos, ...data]);
      setNewTask("");
    }
  }

  return (
    <div>
      <h1>Todos</h1>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Add a new task"
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.task}</li>
        ))}
      </ul>
    </div>
  );
}
