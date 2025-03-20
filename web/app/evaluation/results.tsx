"use client"

import { Flex, Text } from '@radix-ui/themes';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import Image from 'next/image';
import { EvaluationImage } from './image';

async function getEvaluationData(model: string): Promise<EvaluationData[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await supabase
    .from('evals_actual')
    .select(`
      *,
      evals_expected!inner(filename, matches_expected, matches_potential)
    `)
    .eq('model', model);
    
  if (error) {
    console.error('Error fetching evaluation data:', error);
    return [];
  }

  const parsedData = data.map((item) => EvaluationDataSchema.parse(item));
  
  return parsedData;
}

interface MetaEvaluationData {
  numUnexpectedStrongMatches: number;
  totalStrongMatches: number;
  numMissingStrongMatches: number;
  totalExpectedStrongMatches: number;
}

export function EvaluationPageResults(props: { model: string | null, highThreshold: number, lowThreshold: number }) {
  const [evaluationData, setEvaluationData] = useState<EvaluationData[]>([]);
  const [metaEvalData, setMetaEvalData] = useState<MetaEvaluationData>({
    numUnexpectedStrongMatches: 0,
    totalStrongMatches: 0,
    numMissingStrongMatches: 0,
    totalExpectedStrongMatches: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!props.model) { return; }
      const data = await getEvaluationData(props.model);
      const processedData = processDataForUI(data);
      setEvaluationData(processedData);
    };
    
    fetchData();
  }, [props.model]);

  useEffect(() => {
    const processedData = processDataForUI(evaluationData);
    setEvaluationData(processedData);
  }, [props.highThreshold, props.lowThreshold]);

  // Refactor data structure for UI, adding flags
  function processDataForUI(data: EvaluationData[]): EvaluationData[] {
    let MED: MetaEvaluationData = {
      numUnexpectedStrongMatches: 0,
      totalStrongMatches: 0,
      numMissingStrongMatches: 0,
      totalExpectedStrongMatches: 0,
    };

    for (const item of data) {
      const filenameToMatch = new Map<string, { image_url: string, similarity: number }>();
      const expectedAndPotentialFilenames = item.evals_expected.matches_expected.concat(item.evals_expected.matches_potential);

      for (const match of item.matches) {
        const filename = removeExtension(match.filename);
        filenameToMatch.set(filename, {
          image_url: match.image_url,
          similarity: match.similarity,
        });

        match._is_unexpected_strong_match = match.similarity >= props.highThreshold && !expectedAndPotentialFilenames.includes(filename);
        
        MED.totalStrongMatches++;
        if (match._is_unexpected_strong_match) {
          MED.numUnexpectedStrongMatches++;
        }
      }

      item.evals_expected._matches_expected = item.evals_expected.matches_expected.map(filename => {
        const match = filenameToMatch.get(filename);
        const hasNoStrongMatch = !match || match.similarity < props.highThreshold;
        
        MED.totalExpectedStrongMatches++;
        if (hasNoStrongMatch) {
          MED.numMissingStrongMatches++;
        }

        return {
          filename: filename,
          similarity: match?.similarity,
          image_url: match?.image_url,
          _has_no_strong_match: hasNoStrongMatch,
        }
      });

      item.evals_expected._matches_potential = item.evals_expected.matches_potential.map(filename => {
        const match = filenameToMatch.get(filename);
        
        return {
          filename: filename,
          similarity: match?.similarity,
          image_url: match?.image_url,
        }
      });
    }

    setMetaEvalData(MED);

    return data;
  }

  if (!props.model) {
    return null;
  }

  if (evaluationData.length === 0) {
    return <div className="w-full">Loading...</div>;
  }

  const unexpectedStrongMatchesPercentage = Math.round((metaEvalData.numUnexpectedStrongMatches / metaEvalData.totalStrongMatches) * 100);
  const missingStrongMatchesPercentage = Math.round((metaEvalData.numMissingStrongMatches / metaEvalData.totalExpectedStrongMatches) * 100);
  
  return (
    <div className="h-full overflow-y-scroll w-full font-[family-name:var(--font-geist-mono)] pt-3">
      <Text size="1" weight="bold" color="gray" mr="6">
        Unexpected high-confidence matches: {metaEvalData.numUnexpectedStrongMatches}/{metaEvalData.totalStrongMatches} ({unexpectedStrongMatchesPercentage}%)
      </Text>
      <Text size="1" weight="bold" color="gray" mr="6">
        Expected high-confidence matches: {metaEvalData.totalExpectedStrongMatches - metaEvalData.numMissingStrongMatches}/{metaEvalData.totalExpectedStrongMatches} ({100 - missingStrongMatchesPercentage}%)
      </Text>

      <div>
        <ul className="divide-y">
          {evaluationData.map((item) => {
            return (
              <li key={item.id} className="py-4 hover:bg-gray-50">
                <Flex direction="row" gap="3">
                  <div className="w-[150px] h-[150px] flex flex-col items-center mt-1">
                    <Image 
                      src={item.image_url} 
                      alt={item.filename} 
                      width={150} 
                      height={150}
                      className='max-w-[150px] max-h-[150px] object-cover object-center rounded-md' 
                    />
                    <p className="text-[10px] text-gray-500">{removeExtension(item.filename).replace('x_', ' ')}</p>
                  </div>

                  <Flex direction="column" gap="1" flexGrow="1" overflowX="scroll" className="hide-scrollbar">
                    <Flex direction="column">
                      <Text size="1" weight="bold" color="gray">Matches</Text>
                      <Flex direction="row" gap="1">
                        {item.matches.map((match) => {
                          return (
                            <EvaluationImage 
                              key={match.id} 
                              imageUrl={match.image_url} 
                              filename={match.filename} 
                              percent={match.similarity} 
                              highThreshold={props.highThreshold}
                              lowThreshold={props.lowThreshold}
                              warning={match._is_unexpected_strong_match}
                              warningText="Unexpected high-confidence match"
                            />
                          )
                        })}
                      </Flex>
                    </Flex>

                    <Flex direction="row">
                      {!!item.evals_expected._matches_expected?.length && (
                        <Flex direction="column" mr="6">
                          <Text size="1" weight="bold" color="gray">Expected</Text>
                          <Flex direction="row" gap="1">
                            {item.evals_expected._matches_expected?.map((expectedMatch) => (
                              <EvaluationImage 
                                key={expectedMatch.filename} 
                                imageUrl={expectedMatch.image_url} 
                                filename={expectedMatch.filename} 
                                percent={expectedMatch.similarity} 
                                highThreshold={props.highThreshold}
                                lowThreshold={props.lowThreshold}
                                warning={expectedMatch._has_no_strong_match}
                                warningText="Did not match with high confidence"
                              />
                            ))}
                          </Flex>
                        </Flex>
                      )}
                      
                      {!!item.evals_expected._matches_potential?.length && (
                        <Flex direction="column">
                          <Text size="1" weight="bold" color="gray">Nice to have</Text>
                          <Flex direction="row" gap="1">
                            {item.evals_expected._matches_potential.map((potentialMatch) => (
                              <EvaluationImage 
                                key={potentialMatch.filename} 
                                imageUrl={potentialMatch.image_url} 
                                filename={potentialMatch.filename} 
                                percent={potentialMatch.similarity} 
                                highThreshold={props.highThreshold}
                                lowThreshold={props.lowThreshold}
                              />
                            ))}
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const EvaluationDataSchema = z.object({
  id: z.number(),
  image_url: z.string(),
  filename: z.string(),
  matches: z.array(z.object({
    id: z.number(),
    filename: z.string(),
    image_url: z.string(),
    similarity: z.number(),
    _is_unexpected_strong_match: z.boolean().optional(), // not in original data but added by client for UI
  })),
  evals_expected: z.object({
    matches_expected: z.array(z.string()),
    _matches_expected: z.array(z.object({ // not in original data but added by client for UI
      filename: z.string(),
      image_url: z.string().optional(),
      similarity: z.number().optional(),
      _has_no_strong_match: z.boolean(),
    })).optional(),
    matches_potential: z.array(z.string()),
    _matches_potential: z.array(z.object({ // not in original data but added by client for UI
      filename: z.string(),
      image_url: z.string().optional(),
      similarity: z.number().optional(),
    })).optional(),
  }),
});

type EvaluationData = z.infer<typeof EvaluationDataSchema>;

function removeExtension(filename: string): string {
  const parts = filename.split('.');
  // If there's only one part (no extension) or empty string, return the original filename
  if (parts.length <= 1) {
    return filename;
  }
  // Otherwise, return everything except the last part
  return parts.slice(0, -1).join('.');
}
