// frontend/src/api/courseApi.js
const API_URL = "http://localhost:5000/api/courses";

export const fetchCourses = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch courses");
  return data;
};

export const createCourse = async (courseData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(courseData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create course");
  return data;
};

export const updateCourse = async (courseData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(courseData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update course");
  return data;
};

export const deleteCourse = async (courseId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${courseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete course");
  return data;
};
