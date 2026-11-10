import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useStore } from 'zustand';
import {
  Alert,
  Box,
  Button,
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { Unit } from '@domain/scheduling/Unit';
import { SectionHeader } from '@presentation/components/SectionHeader';
import { SurfaceCard } from '@presentation/components/SurfaceCard';
import { sessionDiagnostics } from '@presentation/diagnostics/SessionDiagnostics';
import { LocalStorageEmployeeDirectory } from '@presentation/employees/LocalStorageEmployeeDirectory';
import { LocalScheduleGateway } from '@presentation/schedule/LocalScheduleGateway';
import { UNIT_LABEL } from '@presentation/schedule/scheduleLabels';
import { weekTabLabel } from '@presentation/schedule/weekLabels';
import { LocalStorageCoverageSettings } from '@presentation/rules/LocalStorageCoverageSettings';
import { BrowserFileSaver } from './fileSaver';
import { ImportExportViewModel, type ExportSelection } from './ImportExportViewModel';

const AUTO = 'auto';
const ALL = 'all';

export function ImportExportPage(): JSX.Element {
  const viewModel = useMemo(() => {
    const directory = new LocalStorageEmployeeDirectory(window.localStorage);
    return new ImportExportViewModel(
      directory,
      new LocalScheduleGateway(directory, new LocalStorageCoverageSettings(window.localStorage)),
      new BrowserFileSaver(),
      sessionDiagnostics,
    );
  }, []);
  useEffect(() => {
    void viewModel.loadWeeks();
  }, [viewModel]);

  const fileInput = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<string>('0');

  const fileName = useStore(viewModel.store, (state) => state.fileName);
  const preview = useStore(viewModel.store, (state) => state.preview);
  const unit = useStore(viewModel.store, (state) => state.unit);
  const weeks = useStore(viewModel.store, (state) => state.weeks);
  const message = useStore(viewModel.store, (state) => state.message);
  const error = useStore(viewModel.store, (state) => state.error);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }
    viewModel.previewImport(file.name, await file.text());
    event.target.value = '';
  };

  const exportSelection = (): ExportSelection => (selection === ALL ? 'all' : Number(selection));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" component="h2">
          Importar e exportar planilha
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use o mesmo modelo da planilha de escala (CSV): Nº, Colaborador, Horário / Turno, os dias
          de Segunda a Domingo e Total de folgas.
        </Typography>
      </Box>

      {message !== null && <Alert severity="success">{message}</Alert>}
      {error !== null && <Alert severity="error">{error}</Alert>}

      <SurfaceCard>
        <SectionHeader
          title="Importar colaboradores"
          action={
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInput.current?.click()}
            >
              Escolher planilha
            </Button>
          }
        />
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label="Arquivo da planilha"
          onChange={(event) => void chooseFile(event)}
        />

        {preview === null ? (
          <Typography variant="body2" color="text.secondary">
            Escolha um arquivo CSV. Antes de gravar, você confere a lista aqui. Quem já tem o mesmo
            número é atualizado, sem duplicar.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>{fileName}</strong>: {preview.employees.length} colaborador(es)
                encontrado(s)
                {preview.issues.length > 0 && `, ${preview.issues.length} linha(s) com problema`}.
              </Typography>
              <TextField
                select
                size="small"
                label="Unidade"
                value={unit ?? AUTO}
                onChange={(event) =>
                  viewModel.setUnit(
                    event.target.value === AUTO ? null : (event.target.value as Unit),
                  )
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value={AUTO}>Deduzir pelas folgas</MenuItem>
                {Object.values(Unit).map((item) => (
                  <MenuItem key={item} value={item}>
                    {UNIT_LABEL[item]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {preview.issues.length > 0 && (
              <Alert severity="warning">
                {preview.issues.map((issue) => `Linha ${issue.line}: ${issue.message}`).join(' ')}
              </Alert>
            )}

            {preview.employees.length > 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="Colaboradores a importar">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nº</TableCell>
                      <TableCell>Colaborador</TableCell>
                      <TableCell>Horário / Turno</TableCell>
                      <TableCell>Unidade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.employees.map((employee) => (
                      <TableRow key={employee.registration} hover>
                        <TableCell>{employee.registration}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.shift ?? '—'}</TableCell>
                        <TableCell>{UNIT_LABEL[employee.unit]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Box>
              <Button
                variant="contained"
                disabled={preview.employees.length === 0}
                onClick={() => void viewModel.confirmImport()}
              >
                {`Importar ${preview.employees.length} colaborador(es)`}
              </Button>
            </Box>
          </Stack>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeader title="Exportar escala" />
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Período"
            value={selection}
            onChange={(event) => setSelection(event.target.value)}
            sx={{ minWidth: 280 }}
            disabled={weeks.length === 0}
          >
            {weeks.map((week) => (
              <MenuItem key={week.index} value={String(week.index)}>
                {weekTabLabel(week.index, week.startDate)}
              </MenuItem>
            ))}
            {weeks.length > 1 && (
              <MenuItem value={ALL}>{`Todas as ${weeks.length} semanas`}</MenuItem>
            )}
          </TextField>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={weeks.length === 0}
            onClick={() => void viewModel.exportCsv(exportSelection())}
          >
            Exportar CSV
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          A planilha sai no padrão da base, com Trabalho e Folga em cada dia. Ela traz a escala
          gerada a partir do cadastro; trocas manuais feitas na tela Escala semanal não entram.
        </Typography>
      </SurfaceCard>
    </Stack>
  );
}
