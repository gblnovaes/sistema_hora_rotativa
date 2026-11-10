import { useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Unit, policyOf } from '@domain/scheduling/Unit';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { sessionDiagnostics } from '@presentation/diagnostics/SessionDiagnostics';
import { EmployeesViewModel } from './EmployeesViewModel';
import { LocalStorageEmployeeDirectory } from './LocalStorageEmployeeDirectory';
import type { EmployeeRecord } from './employeeDirectory';

const UNIT_LABEL: Record<Unit, string> = {
  [Unit.Administrativo]: 'Administrativo',
  [Unit.Mooca]: 'Mooca',
};

function restSummary(unit: Unit): string {
  const policy = policyOf(unit);
  const fixed = policy.fixedRestDays.length === 2 ? 'Sáb + Dom' : 'Dom';
  return policy.rotatingRestCount > 0 ? `${fixed} + 1 rotativa` : `${fixed} fixas`;
}

const EMPTY: EmployeeRecord = { registration: '', name: '', unit: Unit.Mooca };

export function EmployeesPage(): JSX.Element {
  const viewModel = useMemo(
    () =>
      new EmployeesViewModel(
        new LocalStorageEmployeeDirectory(window.localStorage),
        sessionDiagnostics,
      ),
    [],
  );
  useEffect(() => {
    void viewModel.load();
  }, [viewModel]);

  const employees = useStore(viewModel.store, (state) => state.employees);
  const error = useStore(viewModel.store, (state) => state.error);

  const [form, setForm] = useState<EmployeeRecord>(EMPTY);
  const [editing, setEditing] = useState(false);

  const submit = async (): Promise<void> => {
    await viewModel.save(form);
    if (viewModel.store.getState().error === null) {
      setForm(EMPTY);
      setEditing(false);
    }
  };

  const edit = (record: EmployeeRecord): void => {
    setForm(record);
    setEditing(true);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Colaboradores
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cadastro local. Os dados ficam salvos neste computador.
        </Typography>
      </Box>

      <SurfaceCard>
        <SectionHeader title={editing ? 'Editar colaborador' : 'Novo colaborador'} />
        {error !== null && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            label="Matrícula"
            value={form.registration}
            disabled={editing}
            onChange={(event) => setForm({ ...form, registration: event.target.value })}
            sx={{ width: 140 }}
          />
          <TextField
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <TextField
            select
            label="Unidade"
            value={form.unit}
            onChange={(event) => setForm({ ...form, unit: event.target.value as Unit })}
            sx={{ width: 180 }}
          >
            {Object.values(Unit).map((unit) => (
              <MenuItem key={unit} value={unit}>
                {UNIT_LABEL[unit]}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={() => void submit()}>
            {editing ? 'Salvar' : 'Adicionar'}
          </Button>
          {editing && (
            <Button
              onClick={() => {
                setForm(EMPTY);
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
          )}
        </Box>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader title={`Cadastrados (${employees.length})`} />
        {employees.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum colaborador cadastrado ainda.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Matrícula</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Unidade</TableCell>
                <TableCell>Folgas</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.registration} hover>
                  <TableCell>{employee.registration}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{UNIT_LABEL[employee.unit]}</TableCell>
                  <TableCell>{restSummary(employee.unit)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" aria-label="Editar" onClick={() => edit(employee)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Remover"
                      onClick={() => void viewModel.remove(employee.registration)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </Stack>
  );
}
