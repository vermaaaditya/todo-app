import { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Sun, Moon, CheckCircle2 } from 'lucide-react';

const ItemTypes = {
  TASK: 'task',
};

const defaultCategories = ['Work', 'Personal', 'Urgent'];

export default function TodoApp() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('todo-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0]);
  const [categories, setCategories] = useState(defaultCategories);
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [theme, setTheme] = useState('dark');

  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem('todo-tasks', JSON.stringify(updatedTasks));
  };

  const addTask = () => {
    if (newTask.trim() === '') return;
    const task = {
      id: uuidv4(),
      text: newTask,
      category: selectedCategory,
      completed: false,
    };
    saveTasks([...tasks, task]);
    setNewTask('');
  };

  const deleteTask = (id) => {
    const updated = tasks.filter((task) => task.id !== id);
    saveTasks(updated);
  };

  const toggleCompleted = (id) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updated);
  };

  const moveTask = (dragIndex, hoverIndex, category) => {
    const categoryTasks = tasks.filter((t) => t.category === category);
    const otherTasks = tasks.filter((t) => t.category !== category);

    const updatedCategoryTasks = [...categoryTasks];
    const [movedTask] = updatedCategoryTasks.splice(dragIndex, 1);
    updatedCategoryTasks.splice(hoverIndex, 0, movedTask);

    saveTasks([...otherTasks, ...updatedCategoryTasks]);
  };

  const moveTaskToCategory = (taskId, newCategory) => {
    const updated = tasks.map((task) =>
      task.id === taskId ? { ...task, category: newCategory } : task
    );
    saveTasks(updated);
  };

  const handleRenameCategory = (index, newName) => {
    const updatedCategories = [...categories];
    const oldName = updatedCategories[index];
    updatedCategories[index] = newName;

    const updatedTasks = tasks.map((task) =>
      task.category === oldName ? { ...task, category: newName } : task
    );

    setCategories(updatedCategories);
    saveTasks(updatedTasks);
    setRenamingCategory(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`min-h-screen p-6 font-roboto-mono ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}
        style={{
          backgroundImage: theme === 'light' ? `url('background.jpg')` : 'none',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl special-gothic-expanded-one-regular">🌟 Customizable To-Do List</h1>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-yellow-400 hover:text-yellow-300">
              {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              className="border p-3 rounded w-full sm:flex-1 text-black"
              type="text"
              placeholder="Enter task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <select
              className="border p-3 rounded text-black"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button className="bg-purple-600 text-white p-3 rounded hover:bg-purple-700" onClick={addTask}>Add</button>
          </div>

          <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
            {categories.map((category, i) => {
              const categoryTasks = tasks.filter((task) => task.category === category);
              const colors = ['bg-yellow-200', 'bg-green-200', 'bg-red-200'];
              return (
                <CategoryColumn
                  key={category}
                  category={category}
                  index={i}
                  tasks={categoryTasks}
                  allTasks={tasks}
                  categories={categories}
                  setRenamingCategory={setRenamingCategory}
                  renamingCategory={renamingCategory}
                  handleRenameCategory={handleRenameCategory}
                  moveTask={moveTask}
                  moveTaskToCategory={moveTaskToCategory}
                  deleteTask={deleteTask}
                  toggleCompleted={toggleCompleted}
                  colorClass={colors[i % colors.length]}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

function CategoryColumn({ category, index, tasks, allTasks, categories, setRenamingCategory, renamingCategory, handleRenameCategory, moveTask, moveTaskToCategory, deleteTask, toggleCompleted, colorClass }) {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TASK,
    drop: (item) => {
      if (item.category !== category) {
        moveTaskToCategory(item.id, category);
        item.category = category;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={drop} className={`p-4 rounded-lg shadow ${colorClass} ${isOver ? 'ring-2 ring-blue-400' : ''} text-black`}>
      {renamingCategory === index ? (
        <input
          className="mb-3 p-2 border rounded w-full"
          defaultValue={category}
          onBlur={(e) => handleRenameCategory(index, e.target.value)}
          autoFocus
        />
      ) : (
        <h2 onClick={() => setRenamingCategory(index)} className="text-xl font-bold mb-4 text-center cursor-pointer">
          {category}
        </h2>
      )}
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <DraggableTask
            key={task.id}
            task={task}
            index={i}
            category={category}
            moveTask={(dragIndex, hoverIndex) => moveTask(dragIndex, hoverIndex, category)}
            deleteTask={deleteTask}
            toggleCompleted={toggleCompleted}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTask({ task, index, moveTask, category, deleteTask, toggleCompleted }) {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex || item.category !== category) return;
      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: { type: ItemTypes.TASK, id: task.id, index, category },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`p-3 border rounded flex justify-between items-center bg-white shadow-md cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className={`${task.completed ? 'line-through' : ''}`}>{task.text}</span>
      <div className="flex gap-2 ml-4">
        <button onClick={() => toggleCompleted(task.id)} className="text-green-600 hover:text-green-800">
          <CheckCircle2 size={18} />
        </button>
        <button onClick={() => deleteTask(task.id)} className="text-red-600 hover:text-red-800">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
