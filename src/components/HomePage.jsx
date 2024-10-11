import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '../components/HomePage.css';
import Close from '../assets/close.png';
import Profile from '../assets/Profile.png';
import Side from '../assets/side.png'
import Logo from '../assets/pngegg.png'

function App() {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: [],
  });

  const [registerVisible, setRegisterVisible] = useState(false);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [signinVisible, setSigninVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    passwordMatch: false,
  });
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [action, setAction] = useState('');
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [viewTask, setViewTask] = useState(null);  // Store the task being viewed
  const [isViewVisible, setIsViewVisible] = useState(false);  // Show/hide the view details



  const ItemTypes = {
    TASK: 'task',
  };


  const handleSigninClose=()=>{
    setSigninVisible(false);
    setEmail('');
    setPassword('');
    setError({ emailError: '', passwordError: '' });
  }

  const handleSignupClose=()=>{
    setRegisterVisible(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      setIsLoggedIn(true);
      fetchTasks(userId, token);
    }
  }, []);

  const fetchTasks = async (userId, token) => {
    try {
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;
      const userTasks = await axios.get(`${backendUrl}/task/tasks/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const categorizedTasks = {
        todo: [],
        inprogress: [],
        done: [],
      };

      userTasks.data.tasks.forEach((task) => {
        const statusKey = task.status.toLowerCase();
        if (categorizedTasks[statusKey]) {
          categorizedTasks[statusKey].push(task);
        }
      });

      setTasks(categorizedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };


  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditTask(task);  // Set the task to be edited
    setTaskName(task.taskName); // Pre-fill task name
    setTaskDescription(task.description); // Pre-fill task description
    setAction('edit');  // Change action to edit mode
  };


  const handleDeleteClick = (taskId) => {
    setSelectedTaskId(taskId);
    setIsDeleteVisible(true);
  };

 
  const handleCancelDelete = () => {
    setIsDeleteVisible(false);
    setSelectedTaskId(null);
  };
  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;

      await axios.put(
        `${backendUrl}/task/tasks/${editTask._id}`,
        {
          taskName,
          description: taskDescription,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTasks((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        const column = editTask.status.toLowerCase();

        // Update the task details in the relevant column
        updatedTasks[column] = updatedTasks[column].map((task) =>
          task._id === editTask._id ? { ...task, taskName, description: taskDescription } : task
        );
        return updatedTasks;
      });

      // Clear the edit state after successful edit
      setEditTask(null);
      setTaskName('');
      setTaskDescription('');
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  const Task = ({ task, index, column }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.TASK,
      item: { index, column },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    return (
      <div ref={drag} className="task" style={{ opacity: isDragging ? 0.5 : 1 }}>
        <h4>{task.taskName}</h4>
        <p>{task.description}</p>
        <div className="task-buttons">
            <button onClick={() => handleEdit(task)}>Edit</button>
            <button onClick={() => handleViewDetails(task)}>View Details</button>
            <button onClick={() => handleDeleteClick(task._id)}>Delete</button>
          </div>
      </div>
    );
  };

  const Column = ({ columnName, tasks=[] }) => {
    const [, drop] = useDrop({
      accept: ItemTypes.TASK,
      drop: (draggedItem) => {
        if (draggedItem.column !== columnName) {
          moveTask(draggedItem.index, draggedItem.column, tasks.length, columnName);
          draggedItem.index = tasks.length;
          draggedItem.column = columnName;
        }
      },
    });

    return (
      <div className="task-column" ref={drop}>
        <h3>{columnName.charAt(0).toUpperCase() + columnName.slice(1)}</h3>
        {tasks.map((task, index) => (
          <Task key={index} task={task} index={index} column={columnName} />
        ))}
      </div>
    );
  };

  const moveTask = async (fromIndex, fromColumn, toIndex, toColumn) => {
    const updatedTasks = { ...tasks };

    // Normalize the column names to lowercase to match the state keys
    fromColumn = fromColumn.toLowerCase();
    toColumn = toColumn.toLowerCase();

    // Log for debugging
    console.log("Columns (after normalization):", { fromColumn, toColumn });
    console.log("Tasks state before move:", updatedTasks);

    // Ensure both columns exist
    if (!updatedTasks[fromColumn] || !updatedTasks[toColumn]) {
        console.error(`Column not found: ${fromColumn} or ${toColumn}`);
        return;
    }

    // Get the task being moved
    const [movedTask] = updatedTasks[fromColumn].splice(fromIndex, 1);
    if (!movedTask) {
        console.error('No task found at the given index');
        return;
    }

    // Update the moved task's status
    movedTask.status = toColumn.toLowerCase();// Update the status to the new column

    // Moving to a new column (push to the end of the new column)
    updatedTasks[toColumn].splice(toIndex, 0, movedTask);

    setTasks(updatedTasks); // Update local state
    console.log("Updated tasks state:", updatedTasks);

    // Save the updated task status to the backend
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;

      const response = await axios.put(`${backendUrl}/task/tasks/status/${movedTask._id}`,  {
        taskId: movedTask._id, // Add the task ID here
        status: movedTask.status // Add the updated status here
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Task update response:', response.data); // Log the response for debugging
    } catch (error) {
      console.error('Error updating task status:', error);
    }
};



  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const newError = {
      firstName: !firstName,
      lastName: !lastName,
      email: !email,
      password: !password,
      confirmPassword: !confirmPassword,
      passwordMatch: password !== confirmPassword,
    };

    setError(newError);

    if (Object.values(newError).includes(true)) return;

    const userData = { firstName, lastName, email, password,confirmPassword };

    try {
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/user/register`, userData);
      const userId = response.data.userId;

      localStorage.setItem('userId', userId);
      setSuccess('User registered successfully!');
      setRegisterVisible(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Signup failed. Try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError({ emailError: '', passwordError: '' });
    const userData = { email, password };

    try {
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/user/login`, userData);
      const token = response.data.token;
      const userId = response.data.userId;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);

      setSuccess('Login successful!');
      setSigninVisible(false);
      setIsLoggedIn(true);

      const userTasks = await axios.get(`${backendUrl}/task/tasks/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const categorizedTasks = {
        todo: [],
        inprogress: [],
        done: [],
      };

      userTasks.data.tasks.forEach((task) => {
        const statusKey = task.status.toLowerCase();
        console.log(`Processing task: ${task.taskName}, Status: ${task.status}`); // Log task details
        if (categorizedTasks[statusKey]) {
            categorizedTasks[statusKey].push(task);
        } else {
            console.warn(`No category found for status: ${statusKey}`); // Warn if no category
        }
    });
    

      setTasks(categorizedTasks);
      console.log('Categorized tasks',categorizedTasks);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const errorMessage = error.response.data.message;
  
        if (errorMessage === 'Invalid email or password') {
          // Set error for both if backend doesn't specify
          setError({
            emailError: 'Invalid email or password',
            passwordError: 'Invalid email or password'
          });
        }
        // Optionally, check if backend returns more specific messages for each case
        // e.g., backend response differentiates between wrong email or wrong password
      } else {
        console.error('Login error:', error);
      }
    
     
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const newTask = { taskName, description: taskDescription ,status: 'todo' };

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/task/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const createdTask= response.data.task;

      setTasks((prevTasks) => ({
        ...prevTasks,
        todo: [...prevTasks.todo, createdTask],
           }));
      setAddTaskVisible(false);
      setTaskName('');
      setTaskDescription('');
      console.log('newTask', createdTask);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleLogout = () => {
    // Clear local storage and reset the logged-in state
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setTasks({ todo: [], inProgress: [], done: [] });
    setSuccess('Logged out successfully.');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
  };


  // Handle Delete Task
  const handleDeleteTask = async () => {
    if (!selectedTaskId) {
      console.error('No task selected for deletion');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_TASK_manager_BACKEND_URL;
      
      // Perform deletion
      await axios.delete(`${backendUrl}/task/tasks/${selectedTaskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update the tasks list after successful deletion
      setTasks((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        // Assuming tasks are grouped by their status (e.g., columns)
      Object.keys(updatedTasks).forEach(column => {
        updatedTasks[column] = updatedTasks[column].filter(task => task._id !== selectedTaskId);
      });
        return updatedTasks;
      });
  
      setIsDeleteVisible(false);  // Close the delete confirmation modal
      setSelectedTaskId(null);  // Clear the selected task ID
    } catch (error) {
      console.error('Error deleting task:', error.response?.data || error.message);
    }
  };

  const handleViewDetails = (task) => {
    setViewTask(task);       // Set the selected task to view
    setIsViewVisible(true);  // Show the details view
  };
  
  const handleCloseDetails = () => {
    setIsViewVisible(false);  // Hide the details view
    setViewTask(null);        // Clear the selected task
  };
  
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div id="body">
        <div id="navbar">

          <div  id="logo" style={{display:'flex',flexDirection:'row',left:'10%',position:'absolute'}}>
            <img src={Logo}/>
            <h1 style={{color:'#010038'}}>T</h1>
            <h1>ask Manager</h1>
          </div>
          {!isLoggedIn ? (
            <>
              <button onClick={() => setRegisterVisible(true)}>Signup</button>
              <button onClick={() => setSigninVisible(true)}>Login</button>
            </>
          ) : (
            <>
              <>
              <button onClick={() => setAddTaskVisible(true)}>+ Add Task</button>
              <button onClick={handleLogout}>Logout</button> {/* Logout Button */}
            </>
            <img src={Profile} alt="Profile" />
            </>
          )}
        </div>

           {/* Signup Modal */}
           {registerVisible && (
          <div className="modal">
            <div className="overlay"  style={{ width: '100vw', position: 'fixed', top: '0', left: '0', height: '200vh', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
            <div className="modal-content">
              <img src={Close} alt="Close" onClick={handleSignupClose} />
              <h2>Signup</h2>
              <form onSubmit={handleSignup}>
                <div>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  {error.firstName && <p style={{color:'red'}}>First name is required.</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  {error.lastName && <p style={{color:'red'}}>Last name is required.</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {error.email && <p style={{color:'red'}}>Email is required.</p>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error.password && <p style={{color:'red'}}>Password is required.</p>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {error.confirmPassword && <p style={{color:'red'}}>Confirm password is required.</p>}
                  {error.passwordMatch && <p style={{color:'red'}}>Passwords do not match.</p>}
                </div>
                <button type="submit">Signup</button>
              </form>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {signinVisible && (
          <div className="modal">
            <div className="overlay"   style={{ width: '100vw', position: 'fixed', top: '0', left: '0', height: '200vh', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
            <div className="modal-content">
              <img src={Close} alt="Close" onClick={handleSigninClose} />
              <h2>Login</h2>
              <form onSubmit={handleLogin}>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                   {error.emailError && <span className="error-message">{error.emailError}</span>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                   {error.passwordError && <span className="error-message">{error.passwordError}</span>}
                </div>
                <button type="submit">Login</button>
              </form>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {addTaskVisible && (
          <div className="modal">
            <div className="overlay"   style={{ width: '100vw', position: 'fixed', top: '0', left: '0', height: '200vh', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
            <div className="modal-content">
              <img src={Close} alt="Close" onClick={() => setAddTaskVisible(false)} />
              <h2>Add Task</h2>
              <form onSubmit={handleAddTask}>
                <div>
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Task Description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit">Add Task</button>
              </form>
            </div>
          </div>
        )}

        <div>
        <div id="task-columns" style={{display:'flex',flexDirection:'row',gap:'50px',top:'100px',left:'0',position:'absolute',width:'100%'}}>
        {['todo', 'inprogress', 'done'].map((columnName) => (
          <Column
            key={columnName}
            columnName={columnName}
            tasks={tasks[columnName]}
          />
        ))}
      </div>


      </div>
        </div>

        {action === 'edit' && editTask && (
          <div>
            <div className="overlay"   style={{ width: '100vw', position: 'fixed', top: '0', left: '0', height: '200vh', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
          <div className="edit-task">
            <h3>Edit Task</h3>
            <form onSubmit={handleEditTask}>
              <label>
                Task Name:
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </label>
              <label>
                Task Description:
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </label>
              <button type="submit">Update Task</button>
            </form>
          </div>
          </div>
        )}


       

        {/* Delete Task Confirmation */}
        {isDeleteVisible && (
        <div>
          <div className="overlay"   style={{ width: '100vw', position: 'fixed', top: '0', left: '0', height: '200vh', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
        <div className="delete-confirmation">
          <p>Are you sure you want to delete this task?</p>
          <button onClick={handleDeleteTask}>Confirm</button>
          <button onClick={handleCancelDelete}>Cancel</button>
        </div>
        </div>
      )}

{isViewVisible && viewTask && (
  <div>
    <div className="overlay"   style={{ width: '100vw', position: 'fixed', top: '0', left: '0', height: '200vh', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
  <div className="task-details-modal">
    <h3>Task Details</h3>
    <p><strong>Task Name:</strong> {viewTask.taskName}</p>
    <p><strong>Description:</strong> {viewTask.description}</p>
    <p><strong>Created At:</strong> {new Date(viewTask.createdAt).toLocaleString()}</p>
    <button onClick={handleCloseDetails}>Close</button>
  </div>
  </div>
)}


       
    </DndProvider>
  );
}

export default App;
