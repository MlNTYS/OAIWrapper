import { useEffect } from 'react';
import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import useModelStore from '../store/useModelStore';

export default function ModelSelect({ lastModelId }) {
  const { data: models = [] } = useQuery(
    ['models'],
    () => api.get('/models').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );
  const selected = useModelStore((state) => state.selectedModel);
  const setSelected = useModelStore((state) => state.setSelectedModel);

  useEffect(() => {
    if (models.length > 0) {
      if (lastModelId) {
        // If a lastModelId is provided, try to find and select that model
        const lastModel = models.find(m => m.id === lastModelId);
        if (lastModel) {
          setSelected(lastModel);
          return;
        }
      }
      
      // If no lastModelId or model not found, use the first model
      if (!selected) {
        setSelected(models[0]);
      }
    }
  }, [models, lastModelId]);
  
  // This separate effect ensures model is updated when conversation changes
  useEffect(() => {
    if (lastModelId && models.length > 0) {
      const lastModel = models.find(m => m.id === lastModelId);
      if (lastModel) {
        setSelected(lastModel);
      }
    }
  }, [lastModelId]);

  const dataOptions = models.map((m) => ({
    value: m.id.toString(),
    label: `${m.name} (${m.cost ? m.cost + ' 토큰' : '가격 정보 없음'})`,
  }));

  return (
    <Select
      data={dataOptions}
      value={selected ? selected.id.toString() : null}
      onChange={(val) => {
        const model = models.find((m) => m.id.toString() === val);
        if (model) setSelected(model);
      }}
      placeholder="모델 선택"
      style={{ width: 200 }}
    />
  );
} 