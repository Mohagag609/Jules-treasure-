import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { List, ListItem, ListItemText, Typography, CircularProgress, Alert, Paper, Link } from '@mui/material';
import apiClient from '../api';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get('/projects/');
        setProjects(response.data);
      } catch (err) {
        setError('Failed to fetch projects. Please make sure the backend server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Projects
      </Typography>
      <List>
        {projects.length > 0 ? (
          projects.map((project) => (
            <ListItem
              key={project.id}
              button
              component={RouterLink}
              to={`/projects/${project.id}`}
              divider
            >
              <ListItemText
                primary={project.name}
                secondary={`Treasury Balance: ${project.treasury_balance}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography>No projects found.</Typography>
        )}
      </List>
    </Paper>
  );
};

export default ProjectList;
