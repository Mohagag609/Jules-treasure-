import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, CircularProgress, Alert, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Tab
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import apiClient from '../api';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [settlement, setSettlement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState('1');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectResponse = await apiClient.get(`/projects/${projectId}/`);
        setProject(projectResponse.data);

        const settlementResponse = await apiClient.get(`/projects/${projectId}/settlement/`);
        setSettlement(settlementResponse.data);

      } catch (err) {
        setError('Failed to fetch project details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="info">No project data found.</Alert>;

  return (
    <Container>
      <Typography variant="h3" gutterBottom>{project.name}</Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5">Project Summary</Typography>
          <Typography><strong>Start Date:</strong> {project.start_date}</Typography>
          <Typography><strong>End Date:</strong> {project.end_date}</Typography>
          <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
            <strong>Treasury Balance:</strong> {project.treasury_balance}
          </Typography>
        </CardContent>
      </Card>

      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label="project reports">
            <Tab label="Partner Settlement" value="1" />
            <Tab label="Supplier Payments" value="2" />
            <Tab label="Partner Payments" value="3" />
          </TabList>
        </Box>

        {/* Partner Settlement Report */}
        <TabPanel value="1">
          <Typography variant="h5" gutterBottom>Partner Settlement Report</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell align="right">Share (%)</TableCell>
                  <TableCell align="right">Amount Due</TableCell>
                  <TableCell align="right">Amount Paid</TableCell>
                  <TableCell align="right">Settlement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlement.map((s, index) => (
                  <TableRow key={index}>
                    <TableCell>{s.partner_name}</TableCell>
                    <TableCell align="right">{s.percentage}</TableCell>
                    <TableCell align="right">{s.amount_due}</TableCell>
                    <TableCell align="right">{s.total_paid}</TableCell>
                    <TableCell align="right" sx={{ color: s.settlement_amount < 0 ? 'error.main' : 'success.main' }}>
                      {s.settlement_amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Supplier Payments Report */}
        <TabPanel value="2">
          <Typography variant="h5" gutterBottom>Supplier Payments (Outgoing)</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Phase</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.supplier_payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell>{p.supplier_name}</TableCell>
                    <TableCell>{p.phase_name}</TableCell>
                    <TableCell align="right">{p.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Partner Payments Report */}
        <TabPanel value="3">
          <Typography variant="h5" gutterBottom>Partner Payments (Incoming)</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Partner</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.partner_payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell>{p.partner_name}</TableCell>
                    <TableCell align="right">{p.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </TabContext>
    </Container>
  );
};

export default ProjectDetails;
